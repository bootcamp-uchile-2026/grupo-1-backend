import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ type: 'integer' })
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message!: string | string[];

  @ApiProperty()
  error!: string;

  @ApiProperty()
  requestId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  timestamp!: string;

  @ApiProperty()
  path!: string;
}
