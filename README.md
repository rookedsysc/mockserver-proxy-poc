# MockServer OpenAPI Proxy PoC

QA와 프런트엔드 개발자가 하나의 서버 주소만 사용하면서, OpenAPI에 정의된 API는 목 응답을 받고 나머지 요청은 실제 서버로 전달할 수 있는 최소 PoC입니다.

## 동작 구조

```text
client
  |
  v
MockServer :1080
  |-- OpenAPI에 정의됨 --> mock response
  `-- 정의되지 않음 ----> upstream :8080
```

- 목 API: `GET /api/users/{userId}`
- 프록시 API: `GET /api/passthrough`
- 관리 UI: `http://localhost:1080/mockserver/dashboard`
- 준비 상태: `http://localhost:1080/mockserver/ready`

## 실행

Docker와 Docker Compose만 필요합니다.

```bash
docker compose up -d --wait upstream mockserver
docker compose run --rm verifier
```

직접 확인하려면 다음 요청을 실행합니다.

```bash
curl -sS http://localhost:1080/api/users/42
curl -sS http://localhost:1080/api/passthrough
```

종료:

```bash
docker compose down --remove-orphans
```

OpenAPI 명세를 수정한 뒤 MockServer 컨테이너를 다시 생성하면 목 응답이 갱신됩니다.

```bash
docker compose up -d --force-recreate mockserver
```

## 운영 시 주의

이 저장소는 로컬 개발용 PoC입니다. MockServer의 관리 API와 Dashboard를 인증 없이 인터넷이나 공용 사내망에 노출하지 마세요. 운영 환경에서는 접근 제어, TLS, 로그의 민감정보 마스킹, 리소스 제한을 별도로 설계해야 합니다.

## 근거 문서

- [MockServer OpenAPI 사용법](https://www.mock-server.com/mock_server/using_openapi.html)
- [초기 expectation 구성](https://www.mock-server.com/mock_server/initializing_expectations.html)
- [프록시 구성 속성](https://www.mock-server.com/mock_server/configuration_properties.html)
- [MockServer UI](https://www.mock-server.com/mock_server/mockserver_ui.html)
