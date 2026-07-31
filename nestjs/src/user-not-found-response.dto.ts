import { ApiProperty } from "@nestjs/swagger";

export class UserNotFoundResponseDto {
  @ApiProperty({
    description: "응답을 생성한 원본",
    example: "nestjs-openapi",
  })
  source!: string;

  @ApiProperty({
    description: "HTTP 상태 코드",
    example: 404,
  })
  statusCode!: number;

  @ApiProperty({
    description: "비즈니스 에러 코드",
    example: "USER_NOT_FOUND",
  })
  code!: string;

  @ApiProperty({
    description: "에러 메시지",
    example: "User not found",
  })
  message!: string;
}
