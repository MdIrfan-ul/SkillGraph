import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SharedSkillsQueryDto {
  @IsString()
  @IsNotEmpty()
  devId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  minShared?: number;
}

export class CollaborationPathQueryDto {
  @IsString()
  @IsNotEmpty()
  fromId!: string;

  @IsString()
  @IsNotEmpty()
  toId!: string;
}

export class SkillAffinityQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class TeamSuggestionQueryDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  requiredSkills!: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}