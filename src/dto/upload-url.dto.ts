import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UploadUrlDto {
  @ApiProperty({ example: 'profile.png', description: 'Name of the file to upload (jpg, jpeg, png, webp or gif)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;
}
