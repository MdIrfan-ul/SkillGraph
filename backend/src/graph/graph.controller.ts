import { Controller, Get, Query } from '@nestjs/common';
import { GraphService } from './graph.service';
import {
  CollaborationPathQueryDto,
  SharedSkillsQueryDto,
  SkillAffinityQueryDto,
  TeamSuggestionQueryDto,
} from './dto/graph-queries.dto';

@Controller('graph')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Get('shared-skills')
  findSimilarDevelopers(@Query() query: SharedSkillsQueryDto) {
    return this.graphService.findSimilarDevelopers(query.devId, query.minShared ?? 3);
  }

  @Get('collaboration-path')
  findCollaborationPath(@Query() query: CollaborationPathQueryDto) {
    return this.graphService.findCollaborationPath(query.fromId, query.toId);
  }

  @Get('skill-affinity')
  findSkillAffinity(@Query() query: SkillAffinityQueryDto) {
    return this.graphService.findSkillAffinity(query.limit ?? 10);
  }

  @Get('team-suggestion')
  suggestTeam(@Query() query: TeamSuggestionQueryDto) {
    return this.graphService.suggestTeam(query.requiredSkills, query.limit ?? 10);
  }
}