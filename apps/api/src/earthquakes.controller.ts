import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { EarthquakesService } from './earthquakes.service';

@Controller('api')
export class EarthquakesController {
  constructor(
    private readonly earthquakesService: EarthquakesService,
  ) {}

  @Get('health')
  health() {
    return {
      ok: true,
      service: 'quakevision-api',
      source: 'USGS',
    };
  }

  @Get('earthquakes')
  earthquakes(
    @Query('range') range?: string,
    @Query('minMagnitude') minMagnitude?: string,
    @Query('maxDepth') maxDepth?: string,
  ) {
    return this.earthquakesService.getEarthquakes({
      range,
      minMagnitude,
      maxDepth,
    });
  }
}
