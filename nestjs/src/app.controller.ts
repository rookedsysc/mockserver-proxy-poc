import { Controller, Get, Param } from "@nestjs/common";
import {
  ApiExcludeEndpoint,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { UserNotFoundResponseDto } from "./user-not-found-response.dto";
import { UserResponseDto } from "./user-response.dto";

@ApiTags("users")
@Controller("api")
export class AppController {
  @Get("users/:userId")
  @ApiOperation({
    summary: "사용자 조회",
    description:
      "Swagger 명세에서 Mockoon 응답이 자동 생성되는 예제 API",
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
  @ApiNotFoundResponse({
    description: "사용자를 찾을 수 없음",
    type: UserNotFoundResponseDto,
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
    return {
      status: "UP",
    };
  }
}
