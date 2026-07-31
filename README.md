# MockServer OpenAPI Proxy PoC

QA와 프런트엔드 개발자가 하나의 서버 주소만 사용하면서, NestJS Swagger에 정의된 API는 mock 응답을 받고 나머지 요청은 실제 NestJS로 전달하는 PoC입니다.

## 동작 구조

```text
NestJS Swagger decorators
          |
          | 애플리케이션 부팅 시 OpenAPI 생성 및 자동 등록
          v
client -> MockServer :1080
          |-- OpenAPI에 정의됨 --> MockServer mock response
          `-- 정의되지 않음 ----> NestJS :3000
```

NestJS는 부팅할 때 `PUT /mockserver/openapi`를 호출합니다. 따라서 별도 `openapi.yaml`을 관리하거나 Dashboard에서 expectation을 손으로 만들 필요가 없습니다.

## 실행

Docker와 Docker Compose만 필요합니다.

```bash
docker compose up -d --build --wait mockserver nestjs
docker compose run --rm verifier
```

브라우저에서 사용하는 화면은 두 개입니다.

| 화면 | 주소 | 용도 |
|---|---|---|
| Swagger UI | http://localhost:3000/docs | NestJS API 명세와 mock 대상 확인 |
| MockServer Dashboard | http://localhost:1080/mockserver/dashboard | 등록된 expectation, 수신 요청, 프록시 요청 확인 |

프런트엔드와 QA 테스트의 API base URL은 항상 `http://localhost:1080`입니다.

```bash
# Swagger에 포함되어 MockServer가 자동 생성한 응답
curl -sS http://localhost:1080/api/users/42
# {"source":"nestjs-openapi","id":"42","name":"Mock User"}

# Swagger에서 제외되어 실제 NestJS로 전달되는 응답
curl -sS http://localhost:1080/api/passthrough
# {"source":"nestjs-upstream","method":"GET","path":"/api/passthrough"}

# MockServer를 거치지 않은 실제 NestJS 응답 비교
curl -sS http://localhost:3000/api/users/42
# {"source":"nestjs-upstream","id":"42","name":"Real User 42"}
```

종료:

```bash
docker compose down --remove-orphans
```

## mock 추가 방법

1. `nestjs/src/app.controller.ts`에 Swagger 데코레이터가 포함된 endpoint를 추가합니다.
2. response DTO의 `@ApiProperty({ example: ... })`에 QA가 받을 예시를 작성합니다.
3. NestJS 이미지를 다시 빌드합니다.

```bash
docker compose up -d --build --wait nestjs
```

NestJS가 시작되면서 전체 OpenAPI를 다시 동기화합니다. MockServer는 동일 명세의 expectation을 중복 생성하지 않고 추가·변경·삭제 내용을 반영합니다.

실제 서버로 통과시킬 endpoint에는 `@ApiExcludeEndpoint()`를 붙여 OpenAPI에서 제외합니다.

Dashboard 화면은 다음처럼 읽으면 됩니다.

- `Active Expectations`: NestJS OpenAPI에서 생성된 현재 mock 목록
- `Received Requests`: MockServer가 받은 모든 요청
- `Proxied Requests`: expectation과 일치하지 않아 실제 NestJS로 전달된 요청
- `Mock`: PoC 중 일회성 expectation을 직접 추가할 때 사용

자동 생성 여부는 `http://localhost:3000/docs-json`의 `paths`와 Dashboard의 `Active Expectations`를 비교하면 확인할 수 있습니다.

## 운영 시 주의

이 저장소는 로컬 개발용 PoC입니다. MockServer의 관리 API와 Dashboard를 인증 없이 인터넷이나 공용 사내망에 노출하지 마세요. 운영 환경에서는 접근 제어, TLS, 로그의 민감정보 마스킹, 리소스 제한을 별도로 설계해야 합니다.

## 근거 문서

- [NestJS OpenAPI 소개](https://docs.nestjs.com/openapi/introduction)
- [MockServer OpenAPI 사용법](https://www.mock-server.com/mock_server/using_openapi.html)
- [프록시 구성 속성](https://www.mock-server.com/mock_server/configuration_properties.html)
- [MockServer UI](https://www.mock-server.com/mock_server/mockserver_ui.html)
