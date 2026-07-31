# Mockoon OpenAPI Proxy PoC

QA와 프런트엔드 개발자가 Mockoon UI에서 OpenAPI 응답을 선택하고, 하나의 서버 주소로 mock 응답과 실제 NestJS 응답을 함께 사용하는 PoC입니다.

## 동작 구조

```text
NestJS Swagger decorators
          |
          | /docs-json
          v
Mockoon sync container
          |
          | 새 route와 새 status response만 병합
          v
mockoon/environment.json <---- Mockoon Desktop에서 편집
          |
          v
client -> Mockoon CLI :1080
          |-- 등록된 route ----> 선택한 200/404 mock response
          `-- 미등록 route ----> NestJS :3000
```

Mockoon 환경 파일은 Git으로 공유할 수 있습니다. Docker의 Mockoon CLI는 파일 변경을 감시하므로, Desktop UI에서 기본 응답을 바꾸고 저장하면 실행 중인 mock 서버에도 반영됩니다.

## 실행

Docker와 Docker Compose만 있으면 mock 서버와 NestJS를 실행할 수 있습니다.

```bash
docker compose up -d --build --wait mockoon
docker compose run --rm verifier
```

| 대상 | 주소 또는 파일 | 용도 |
|---|---|---|
| Mock API | http://localhost:1080 | 프런트엔드와 QA가 사용하는 단일 base URL |
| Swagger UI | http://localhost:3000/docs | NestJS API 명세 확인 |
| OpenAPI JSON | http://localhost:3000/docs-json | Mockoon 자동 생성 원본 |
| Mockoon UI | `mockoon/environment.json` | Desktop 앱에서 응답 선택과 조건 편집 |

```bash
# OpenAPI 200 응답
curl -sS http://localhost:1080/api/users/42
# {"source":"nestjs-openapi","id":"42","name":"Mock User"}

# OpenAPI에서 제외되어 실제 NestJS로 전달되는 응답
curl -sS http://localhost:1080/api/passthrough
# {"source":"nestjs-upstream","method":"GET","path":"/api/passthrough"}

# Mockoon을 거치지 않은 실제 NestJS 응답
curl -sS http://localhost:3000/api/users/42
# {"source":"nestjs-upstream","id":"42","name":"Real User 42"}
```

종료:

```bash
docker compose down --remove-orphans
```

## Mockoon UI에서 200/404 선택

1. [Mockoon Desktop](https://mockoon.com/download/)을 설치합니다.
2. `Open local environment`에서 저장소의 `mockoon/environment.json`을 엽니다.
3. `GET /api/users/:userId` route를 선택합니다.
4. `200` 또는 `404` 응답 옆의 회색 깃발을 클릭해 기본 응답으로 지정합니다.
5. 파일이 저장되면 Docker의 Mockoon CLI가 변경을 감지해 자동 재시작합니다.

Docker가 `1080` 포트를 사용하므로 Desktop의 실행 버튼은 누르지 않고 응답 편집 UI로만 사용합니다. 응답을 바꾼 뒤 다음 명령으로 확인할 수 있습니다.

```bash
curl -i http://localhost:1080/api/users/42
```

## OpenAPI에서 mock 자동 생성

Compose의 `mockoon-sync` 서비스가 NestJS `/docs-json`을 읽어 Mockoon 환경 파일을 생성합니다. 기존 환경 파일이 있으면 다음 항목만 병합합니다.

- OpenAPI에 새로 추가된 method/path
- 기존 route에 새로 추가된 HTTP status response

기존 route, response body, 응답 규칙, 기본 응답 선택은 수정하거나 삭제하지 않습니다. 따라서 QA가 UI에서 만든 설정을 유지하면서 OpenAPI의 새 API와 상태 코드를 추가할 수 있습니다.

NestJS가 실행 중일 때 OpenAPI만 다시 반영하려면:

```bash
docker compose run --rm mockoon-sync
```

mock 대상에서 제외하고 실제 서버로 통과시킬 endpoint에는 `@ApiExcludeEndpoint()`를 붙입니다.

## mock 추가 방법

1. NestJS controller에 Swagger 데코레이터가 포함된 endpoint를 추가합니다.
2. 성공·실패 응답을 `@ApiOkResponse`, `@ApiNotFoundResponse` 등으로 명세합니다.
3. Response DTO의 `@ApiProperty({ example: ... })`에 mock 예시를 작성합니다.
4. 서비스를 다시 빌드합니다.

```bash
docker compose up -d --build --wait mockoon
```

Mockoon UI에서 새 route와 status response를 확인하고 원하는 응답을 기본값으로 지정할 수 있습니다.

## 운영 시 주의

이 저장소는 로컬 개발용 PoC입니다. 호스트 포트는 `127.0.0.1`에만 바인딩되어 있습니다. 공용 환경에 배포하려면 접근 제어, TLS, 로그 민감정보 마스킹과 리소스 제한을 별도로 설계해야 합니다.

## 근거 문서

- [NestJS OpenAPI 소개](https://docs.nestjs.com/openapi/introduction)
- [Mockoon OpenAPI 가져오기와 재가져오기](https://mockoon.com/docs/latest/openapi/import-export-openapi-format/)
- [Mockoon 다중 응답](https://mockoon.com/docs/latest/route-responses/multiple-responses/)
- [Mockoon Proxy mode](https://mockoon.com/docs/latest/server-configuration/proxy-mode/)
- [Mockoon 환경 파일 공유](https://mockoon.com/docs/latest/mockoon-data-files/sharing-mock-api-files/)
