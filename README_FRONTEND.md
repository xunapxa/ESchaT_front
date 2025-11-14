# ESchaT 프론트엔드

ESchaT 챗봇의 React 기반 웹 프론트엔드입니다.

## 설치 방법

1. Node.js가 설치되어 있는지 확인하세요 (버전 16 이상 권장)

2. 프로젝트 디렉토리에서 의존성 설치:
```bash
npm install
```

## 실행 방법

### 개발 모드로 실행

```bash
npm start
```

브라우저에서 `http://localhost:3000`으로 자동으로 열립니다.

### 백엔드 API URL 설정

기본적으로 프론트엔드는 `http://localhost:8000`의 백엔드 API를 사용합니다.

다른 URL을 사용하려면 `.env` 파일을 생성하고 다음을 추가하세요:

```
REACT_APP_API_URL=http://your-backend-url:8000
```

## 빌드 방법

프로덕션 빌드를 생성하려면:

```bash
npm run build
```

빌드된 파일은 `build/` 폴더에 생성됩니다.

## 주요 기능

- ChatGPT/Claude 스타일의 현대적인 채팅 UI
- 실시간 메시지 전송 및 수신
- 로딩 상태 표시
- 에러 처리
- 반응형 디자인 (모바일 지원)
- 자동 스크롤
- Enter 키로 메시지 전송

## 프로젝트 구조

```
src/
  ├── App.jsx          # 메인 앱 컴포넌트
  ├── App.css          # 앱 스타일
  ├── index.jsx        # React 진입점
  └── index.css        # 전역 스타일

public/
  └── index.html       # HTML 템플릿
```

## 백엔드 연동

백엔드 서버가 실행 중이어야 합니다:

```bash
# 백엔드 디렉토리에서
python app.py
# 또는
uvicorn app:app --host 0.0.0.0 --port 8000
```

백엔드가 다른 포트에서 실행 중이면 `.env` 파일에서 `REACT_APP_API_URL`을 수정하세요.

