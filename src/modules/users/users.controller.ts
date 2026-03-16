import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './services/users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

/**
 * UsersController
 *
 * Endpoints para gestion del perfil del usuario autenticado.
 * Todos los endpoints requieren JWT valido.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/me
   * Retorna el perfil del usuario autenticado con datos del workspace.
   */
  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del usuario actual' })
  async getMyProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  /**
   * PATCH /users/me
   * Actualiza los datos de perfil del usuario autenticado.
   */
  @Patch('me')
  @ApiOperation({ summary: 'Actualizar perfil del usuario actual' })
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }
}
