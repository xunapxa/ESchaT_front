# Railway 배포 가이드

이 프로젝트를 Railway에 배포하는 방법입니다.

## 사전 준비

1. Railway 계정 생성: https://railway.app
2. Git 저장소에 코드 푸시 (GitHub, GitLab 등)

## 배포 단계

### 1. Railway 프로젝트 생성

1. Railway 대시보드에서 "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. 저장소 선택 및 연결

### 2. 환경 변수 설정

Railway 대시보드에서 환경 변수를 설정하세요:

**필수 환경 변수:**
- `REACT_APP_API_URL`: 백엔드 API URL
  - 예: `https://your-backend-service.railway.app`
  - 백엔드가 Railway에 배포되어 있다면 해당 URL 사용
  - **주의**: URL 끝에 슬래시(`/`)를 붙이지 마세요

**선택적 환경 변수:**
- `PORT`: Railway가 자동으로 할당하므로 설정하지 않아도 됩니다.

### 3. 빌드 설정 확인

Railway는 자동으로 다음을 감지합니다:
- **빌드 명령**: `npm run build` (railway.json 또는 자동 감지)
- **시작 명령**: `npm run serve` (Procfile 또는 railway.json 참조)

### 4. 배포

코드를 푸시하면 자동으로 배포가 시작됩니다:

```bash
git add .
git commit -m "Railway 배포 준비"
git push origin main
```

## 파일 설명

- `railway.json`: Railway 빌드 및 배포 설정
- `Procfile`: 프로세스 시작 명령어 정의
- `package.json`: `serve` 패키지가 추가되어 빌드된 정적 파일을 서빙

## 주의사항

1. **백엔드 CORS 설정**: 백엔드에서 프론트엔드 도메인을 허용하도록 CORS 설정이 필요합니다.
   - 예: `allow_origins=["https://your-frontend.railway.app"]`

2. **환경 변수**: `REACT_APP_` 접두사가 붙은 변수만 React 앱에서 사용 가능합니다.

3. **빌드 시간**: 첫 빌드는 시간이 걸릴 수 있습니다 (약 3-5분).

4. **포트 설정**: Railway는 자동으로 포트를 할당하므로 `PORT` 환경 변수는 설정하지 마세요.

## 문제 해결

### 빌드 실패
- Railway 로그 확인 (Deployments 탭)
- `package.json`의 빌드 스크립트 확인
- Node.js 버전 확인 (Railway는 자동으로 감지)

### API 연결 실패
- `REACT_APP_API_URL` 환경 변수 확인
- 백엔드 서비스가 실행 중인지 확인
- CORS 설정 확인
- 브라우저 콘솔에서 네트워크 오류 확인

### 포트 오류
- Railway는 자동으로 포트를 할당합니다
- `serve` 패키지가 자동으로 Railway의 PORT 환경 변수를 사용합니다

### 404 오류 (라우팅 문제)
- `serve` 패키지의 `-s` 옵션이 SPA 라우팅을 처리합니다
- 이미 설정되어 있으므로 문제없습니다

## 배포 후 확인

1. Railway 대시보드에서 생성된 도메인 확인
2. 브라우저에서 접속하여 앱이 정상 작동하는지 확인
3. 개발자 도구 콘솔에서 오류 확인
4. API 호출이 정상적으로 작동하는지 확인

