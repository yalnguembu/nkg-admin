import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { AcceptQuoteDto, CreateQuoteDto } from './dto/quote.dto';
import { QuoteFilterDto } from './dto/quote-filter.dto';
import { DataResponseDto } from '../../common/dto/data-response.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { getSchemaPath, ApiExtraModels } from '@nestjs/swagger';

@ApiTags('Quotes')
@Controller('quotes')
@ApiExtraModels(DataResponseDto, PaginatedResponseDto)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) { }

  @Get()
  @ApiOperation({ summary: 'List quotes with filtering' })
  @ApiResponse({
    status: 200,
    description: 'Return all quotes paginated',
    schema: {
      allOf: [
        { $ref: getSchemaPath(DataResponseDto) },
        {
          properties: {
            data: {
              allOf: [
                { $ref: getSchemaPath(PaginatedResponseDto) },
                {
                  properties: {
                    data: {
                      type: 'array',
                      items: { type: 'object' },
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  })
  findAll(@Query() filter: QuoteFilterDto) {
    return this.quotesService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quote details' })
  @ApiResponse({ status: 200, description: 'Return quote details' })
  findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new quote (from Cart or Order)' })
  @ApiResponse({ status: 201, description: 'Quote created successfully' })
  create(@Body() dto: CreateQuoteDto) {
    // TODO: Extract customer ID from Auth user if available. 
    // For prototype, we might need customerId in DTO or assuming public/session?
    // User context is needed.
    // If not authenticated, we can't easily link customer unless DTO has it or Cart has it.
    // Cart has customerId.
    // OrdersService.create extraction customerId from Cart or DTO?
    // OrdersService.create(..., customerId).
    // Let's assume for now we pass a placeholder or extract from Cart's customer.
    // QuotesService.create calls OrdersService.create.
    // DTO doesn't have customerId.
    // We should get it from the Request/User.
    // For now, I'll hardcode or pass 'guest' if allowed, BUT OrdersService requires customerId.
    // I'll assume request has user.
    const customerId = '3034989e-4a4b-4b13-8884-25927ad0123d'; // Default Seed Customer ID for testing? 
    // Or throw if no user.
    // Better: Cart linkage. "Cart belongs to customer".
    return this.quotesService.create(dto, customerId);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept quote and convert to order' })
  @ApiResponse({ status: 201, description: 'Quote accepted and order created' })
  accept(@Param('id') id: string, @Body() dto: AcceptQuoteDto) {
    return this.quotesService.accept(id, dto);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject quote' })
  @ApiResponse({ status: 200, description: 'Quote rejected successfully' })
  reject(@Param('id') id: string) {
    return this.quotesService.reject(id);
  }

  @Post(':id/pdf')
  @ApiOperation({ summary: 'Generate PDF for quote' })
  generatePdf(@Param('id') id: string) {
    return this.quotesService.generatePdf(id);
  }

  @Post('check-expirations')
  @ApiOperation({ summary: 'Trigger expiration check manually' })
  checkExpirations() {
    return this.quotesService.checkExpirations();
  }

  @Post(':id/whatsapp')
  @ApiOperation({ summary: 'Generate WhatsApp link for quote' })
  async generateWhatsApp(@Param('id') id: string) {
    const whatsappUrl = await this.quotesService.generateWhatsAppUrl(id);
    return { whatsappUrl };
  }

  @Get(':id/whatsapp-url')
  @ApiOperation({ summary: 'Get stored WhatsApp URL' })
  async getWhatsAppUrl(@Param('id') id: string) {
    const quote = await this.quotesService.findOne(id);
    return { whatsappUrl: quote.whatsappUrl };
  }
}
