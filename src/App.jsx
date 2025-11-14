import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
                     'http://localhost:8000';

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
        // 기존 타이머가 있으면 정리
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
                // 타이핑 속도 조절 (한글은 조금 더 빠르게)
                const char = full_text[current_index - 1];
                const delay = /[가-힣]/.test(char) ? 30 : 20;
                typing_timeout_ref.current[message_id] = setTimeout(
                    type_character,
                    delay
                );
            } else {
                // 타이핑 완료 후 정리
                delete typing_timeout_ref.current[message_id];
                // 타이핑 완료 후 약간의 지연 후 상태 정리 (커서가 사라지도록)
                setTimeout(() => {
                    set_typing_text((prev) => {
                        const new_state = { ...prev };
                        delete new_state[message_id];
                        return new_state;
                    });
                }, 500);
            }
        };

        // 약간의 지연 후 시작 (더 자연스럽게)
        typing_timeout_ref.current[message_id] = setTimeout(type_character, 50);
    };

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
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
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question }),
            });

            if (!response.ok) {
                const error_data = await response.json().catch(
                    () => ({ detail: '서버 오류가 발생했습니다.' })
                );
                throw new Error(error_data.detail || 
                               `HTTP ${response.status}`);
            }

            const data = await response.json();
            const bot_message_id = Date.now() + 1;
            const bot_message = {
                id: bot_message_id,
                role: 'assistant',
                content: data.answer,
                matched_question: data.matched_question,
            };

            set_messages((prev) => [...prev, bot_message]);
            // 타이핑 애니메이션 시작
            start_typing_animation(bot_message_id, data.answer);
        } catch (error) {
            const error_message_id = Date.now() + 1;
            const error_text = `오류: ${error.message}`;
            const error_message = {
                id: error_message_id,
                role: 'assistant',
                content: error_text,
                is_error: true,
            };
            set_messages((prev) => [...prev, error_message]);
            // 에러 메시지도 타이핑 애니메이션 적용
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
                                         typing_text[msg.id] !== msg.content;
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
                                <div className="message_content">
                                    {display_text}
                                    {is_typing && (
                                        <span className="typing_cursor">|</span>
                                    )}
                                </div>
                                {/*{msg.matched_question && 
                                 msg.role === 'assistant' && 
                                 !is_typing && (
                                    <div className="matched_question">
                                        <small>
                                            매칭된 질문: {msg.matched_question}
                                        </small>
                                    </div>
                                )}*/}
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
                        onChange={(e) => 
                            set_input_value(e.target.value)
                        }
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

