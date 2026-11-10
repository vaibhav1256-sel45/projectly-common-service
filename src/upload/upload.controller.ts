import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Post, Query } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UploadService } from './upload.service.js';
import { UploadUrlDto } from '../dto/upload-url.dto.js';

@ApiTags('Upload')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('url')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get image upload URL',
    description: 'Returns a presigned S3 URL (valid for 5 minutes). PUT the image to it with the matching Content-Type, then save the returned key.',
  })
  @ApiResponse({ status: 200, description: 'Upload URL generated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or unsupported file type' })
  getUploadUrl(@Body() body: UploadUrlDto) {
    return this.uploadService.generateUploadUrl(body.fileName);
  }

  @Post('attachment-url')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get attachment upload URL',
    description: 'Presigned S3 URL (valid for 5 minutes) for a task attachment. PUT the file with the returned contentType, then save the key.',
  })
  @ApiResponse({ status: 200, description: 'Upload URL generated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or unsupported file type' })
  getAttachmentUrl(@Body() body: UploadUrlDto) {
    return this.uploadService.generateAttachmentUrl(body.fileName);
  }

  @Get('view-url')
  @ApiOperation({
    summary: 'Get image view URL',
    description: 'Returns a temporary presigned S3 link (valid for 1 hour) to show a stored image.',
  })
  @ApiResponse({ status: 200, description: 'View URL generated successfully' })
  async getViewUrl(@Query('key') key?: string) {
    if (!key) {
      throw new BadRequestException('key is required');
    }
    return { viewUrl: await this.uploadService.generateViewUrl(key) };
  }
  
  @Delete('upload')
  @ApiResponse({ status: 200, description: 'Deleted SuccessFully' })
  async deleteObject(@Query('key') key?: string) {
    if (!key) {
      throw new BadRequestException('key is required');
    }
    return { ok: await this.uploadService.deleteObject(key) };
  }

}
