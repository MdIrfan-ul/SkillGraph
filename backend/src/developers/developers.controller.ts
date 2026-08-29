import { Controller, Get, Param, Query } from '@nestjs/common';
import { DevelopersService } from './developers.service';
import { ListDevelopersDto } from './dto/list-developers.dto';
import { DeveloperNetworkDto } from './dto/developer-network.dto';

@Controller('developers')
export class DevelopersController {
  constructor(private readonly developersService: DevelopersService) {}

  @Get()
  findAll(@Query() query: ListDevelopersDto) {
    return this.developersService.findAll(query);
  }

  @Get(':id/network')
  findNetwork(@Param('id') id: string, @Query() query: DeveloperNetworkDto) {
    return this.developersService.findNetwork(id, query.hops ?? 2);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.developersService.findById(id);
  }
}