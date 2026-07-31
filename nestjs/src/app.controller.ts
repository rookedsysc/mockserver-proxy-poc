import {
  Controller,
  Get,
  Param,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { MockSyncState } from "./mock-sync-state";
import { UserResponseDto } from "./user-response.dto";

@ApiTags("users")
@Controller("api")
export class AppController {
  constructor(private readonly mockSyncState: MockSyncState) {}

  @Get("users/:userId")
  @ApiOperation({
    summary: "사용자 조회",
    description:
      "Swagger 명세에서 MockServer expectation이 자동 생성되는 예제 API",
  })
  @ApiParam({
    name: "userId",
    description: "사용자 ID",
    example: "42",
  })
  @ApiOkResponse({
    description: "OpenAPI 예시를 이용한 사용자 응답",
    type: UserResponseDto,
  })
  getUser(@Param("userId") userId: string): UserResponseDto {
    return {
      source: "nestjs-upstream",
      id: userId,
      name: `Real User ${userId}`,
    };
  }

  @Get("passthrough")
  @ApiExcludeEndpoint()
  passthrough(): Record<string, string> {
    return {
      source: "nestjs-upstream",
      method: "GET",
      path: "/api/passthrough",
    };
  }

  @Get("health")
  @ApiExcludeEndpoint()
  health(): Record<string, string> {
    if (!this.mockSyncState.isSynchronized()) {
      throw new ServiceUnavailableException({
        status: "SYNCING",
      });
    }

    return {
      status: "UP",
    };
  }
}
