import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ListProjectsDto } from './dto/list-projects.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@Query() query: ListProjectsDto) {
    return this.projectsService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }
}