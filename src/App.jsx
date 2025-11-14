import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// 타임아웃 설정 (30초)
const FETCH_TIMEOUT = 30000;

function App() {
    const [messages, set_messages] = useState([]);
    const [input_value, set_input_value] = useState('');
    const [is_loading, set_is_loading] = useState(false);
    const [typing_text, set_typing_text] = useState({});
    const messages_end_ref = useRef(null);
    const input_ref = useRef(null);
    const typing_timeout_ref = useRef({});

    const scroll_to_bottom = () => {
        messages_end_ref.current?.scrollIntoView({ 
            behavior: 'smooth' 
        });
    };

    useEffect(() => {
        scroll_to_bottom();
    }, [messages, typing_text]);

    useEffect(() => {
        input_ref.current?.focus();
    }, []);

    // 타이핑 애니메이션 함수
    const start_typing_animation = (message_id, full_text) => {
        if (typing_timeout_ref.current[message_id]) {
            clearTimeout(typing_timeout_ref.current[message_id]);
        }

        let current_index = 0;
        set_typing_text((prev) => ({ ...prev, [message_id]: '' }));

        const type_character = () => {
            if (current_index < full_text.length) {
                set_typing_text((prev) => ({
                    ...prev,
                    [message_id]: full_text.substring(0, current_index + 1),
                }));
                current_index++;

                const char = full_text[current_index - 1];
                const delay = /[가-힣]/.test(char) ? 30 : 20;
                typing_timeout_ref.current[message_id] = setTimeout(
                    type_character,
                    delay
                );
            } else {
                delete typing_timeout_ref.current[message_id];
                setTimeout(() => {
                    set_typing_text((prev) => {
                        const new_state = { ...prev };
                        delete new_state[message_id];
                        return new_state;
                    });
                }, 500);
            }
        };

        typing_timeout_ref.current[message_id] = setTimeout(type_character, 50);
    };

    useEffect(() => {
        return () => {
            const timeouts = typing_timeout_ref.current;
            if (timeouts) {
                Object.values(timeouts).forEach((timeout) => {
                    if (timeout) {
                        clearTimeout(timeout);
                    }
                });
            }
        };
    }, []);

    // 타임아웃이 있는 fetch 래퍼
    const fetchWithTimeout = (url, options, timeout = FETCH_TIMEOUT) => {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.')), timeout)
            )
        ]);
    };

    const send_message = async () => {
        const question = input_value.trim();
        if (!question || is_loading) {
            return;
        }

        const user_message = {
            id: Date.now(),
            role: 'user',
            content: question,
        };

        set_messages((prev) => [...prev, user_message]);
        set_input_value('');
        set_is_loading(true);

        try {
            console.log('Sending request to:', `${API_BASE_URL}/chat`);
            
            const response = await fetchWithTimeout(
                `${API_BASE_URL}/chat`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ question }),
                },
                FETCH_TIMEOUT
            );

            console.log('Response status:', response.status);

            if (!response.ok) {
                let error_data;
                try {
                    error_data = await response.json();
                } catch (e) {
                    error_data = { 
                        detail: `서버 오류 (${response.status})` 
                    };
                }
                throw new Error(error_data.detail || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('Response data:', data);

            const bot_message_id = Date.now() + 1;

            // needs_confirmation이 true인 경우 확인 UI 표시
            if (data.needs_confirmation) {
                const bot_message = {
                    id: bot_message_id,
                    role: 'assistant',
                    content: '',
                    needs_confirmation: true,
                    pending_answer: data.answer,
                    alternative_questions: data.alternative_questions || [],
                    matched_question: data.matched_question,
                };
                set_messages((prev) => [...prev, bot_message]);
            } else {
                // 일반 답변
                const bot_message = {
                    id: bot_message_id,
                    role: 'assistant',
                    content: data.answer,
                    matched_question: data.matched_question,
                };
                set_messages((prev) => [...prev, bot_message]);
                start_typing_animation(bot_message_id, data.answer);
            }

        } catch (error) {
            console.error('Error:', error);
            
            let error_text;
            if (error.message.includes('Failed to fetch') || 
                error.message.includes('NetworkError') ||
                error.message.includes('Load failed')) {
                error_text = '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.';
            } else if (error.message.includes('시간이 초과')) {
                error_text = error.message;
            } else {
                error_text = error.message;
            }

            const error_message_id = Date.now() + 1;
            const error_message = {
                id: error_message_id,
                role: 'assistant',
                content: error_text,
                is_error: true,
            };

            set_messages((prev) => [...prev, error_message]);
            start_typing_animation(error_message_id, error_text);
        } finally {
            set_is_loading(false);
            input_ref.current?.focus();
        }
    };

    const handle_key_press = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send_message();
        }
    };

    // 확인 UI에서 답변 확인 처리
    const handle_confirm_answer = (message_id) => {
        set_messages((prev) => {
            const updated = prev.map((msg) => {
                if (msg.id === message_id && msg.needs_confirmation) {
                    const pending_answer = msg.pending_answer;
                    // 타이핑 애니메이션 시작
                    setTimeout(() => {
                        start_typing_animation(message_id, pending_answer);
                    }, 100);
                    return {
                        ...msg,
                        needs_confirmation: false,
                        content: pending_answer,
                    };
                }
                return msg;
            });
            return updated;
        });
    };

    // 대안 질문 선택 처리
    const handle_select_alternative = (alternative_question) => {
        set_input_value(alternative_question);
        input_ref.current?.focus();
        // 자동으로 전송하지 않고 사용자가 확인 후 전송하도록 함
    };

    return (
        <div className="app">
            <div className="chat_container">
                <div className="chat_header">
                    <h1>ESchaT</h1>
                    <p>질문해주시면 답변해드립니다</p>
                </div>
                <div className="messages_container">
                    {messages.length === 0 && (
                        <div className="welcome_message">
                            <p>안녕하세요! ESchaT입니다.</p>
                            <p>무엇이 궁금하신가요?</p>
                        </div>
                    )}
                    {messages.map((msg) => {
                        const is_typing = msg.role === 'assistant' && 
                                         typing_text[msg.id] !== undefined &&
                                         typing_text[msg.id] !== msg.content &&
                                         !msg.needs_confirmation;
                        const display_text = is_typing 
                            ? typing_text[msg.id] 
                            : msg.content;
                        return (
                            <div
                                key={msg.id}
                                className={`message ${
                                    msg.role === 'user' 
                                        ? 'message_user' 
                                        : 'message_assistant'
                                } ${msg.is_error ? 'message_error' : ''}`}
                            >
                                {msg.needs_confirmation ? (
                                    <div className="confirmation_ui">
                                        <div className="confirmation_message">
                                            <p className="confirmation_question">
                                                이 질문에 대한 답변이 맞나요?
                                            </p>
                                            {msg.matched_question && (
                                                <p className="matched_question_text">
                                                    매칭된 질문: {msg.matched_question}
                                                </p>
                                            )}
                                        </div>
                                        {msg.alternative_questions && 
                                         msg.alternative_questions.length > 0 && (
                                            <div className="alternative_questions">
                                                <p className="alternative_label">
                                                    다른 질문을 찾고 계신가요?
                                                </p>
                                                <div className="alternative_list">
                                                    {msg.alternative_questions.map(
                                                        (alt_q, idx) => (
                                                            <button
                                                                key={idx}
                                                                className="alternative_question_btn"
                                                                onClick={() => 
                                                                    handle_select_alternative(alt_q)
                                                                }
                                                            >
                                                                {alt_q}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div className="confirmation_buttons">
                                            <button
                                                className="confirm_button"
                                                onClick={() => 
                                                    handle_confirm_answer(msg.id)
                                                }
                                            >
                                                네, 맞습니다
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="message_content">
                                        {display_text}
                                        {is_typing && (
                                            <span className="typing_cursor">|</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {is_loading && (
                        <div className="message message_assistant">
                            <div className="message_content">
                                <div className="loading_dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messages_end_ref} />
                </div>
                <div className="input_container">
                    <textarea
                        ref={input_ref}
                        value={input_value}
                        onChange={(e) => set_input_value(e.target.value)}
                        onKeyPress={handle_key_press}
                        placeholder="메시지를 입력하세요... (Enter로 전송)"
                        rows={1}
                        disabled={is_loading}
                        className="input_field"
                    />
                    <button
                        onClick={send_message}
                        disabled={!input_value.trim() || is_loading}
                        className="send_button"
                    >
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;