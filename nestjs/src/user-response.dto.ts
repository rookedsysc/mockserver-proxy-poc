import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
  @ApiProperty({
    description: "응답을 생성한 원본",
    example: "nestjs-openapi",
  })
  source!: string;

  @ApiProperty({
    description: "사용자 ID",
    example: "42",
  })
  id!: string;

  @ApiProperty({
    description: "사용자 이름",
    example: "Mock User",
  })
  name!: string;
}
