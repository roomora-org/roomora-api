import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Hotel } from '../hotels/entities/hotel.entity.js';
import { HotelStatus } from '../hotels/enums/hotel-status.enum.js';
import { Employee } from '../employees/entities/employee.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Role } from '../roles/entities/role.entity.js';
import { CreateOnboardingDto } from './dto/create-onboarding.dto.js';
import { AuthResponseDto } from '../auth/dto/auth-response.dto.js';
import { TokenService } from '../auth/token.service.js';
import { RefreshTokenService } from '../auth/refresh-token/services/refresh-token.service.js';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async completeOnboarding(
    userId: string,
    dto: CreateOnboardingDto,
  ): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const existingEmployee = await this.employeeRepository.findOne({
      where: { user: { id: userId } },
      relations: { role: true, hotel: true },
    });

    // Reject if already onboarded
    if (existingEmployee?.hotel) {
      throw new BadRequestException(
        'You have already completed onboarding.',
      );
    }

    const { employee } = await this.dataSource.transaction(
      async (manager) => {
        const hotelRepository = manager.getRepository(Hotel);
        const employeeRepository = manager.getRepository(Employee);
        const roleRepository = manager.getRepository(Role);

        // Generate a unique slug
        const baseSlug = dto.hotelName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const slug = `${baseSlug}-${Date.now().toString(36)}`;

        // Create the hotel with all optional fields
        const newHotel = hotelRepository.create({
          name: dto.hotelName,
          slug,
          description: dto.description?.trim() || null,
          email: user.email,
          phone: dto.hotelPhone,
          alternativePhone: dto.alternativePhone?.trim() || null,
          country: dto.country,
          city: dto.city,
          address: dto.address,
          postalCode: dto.postalCode?.trim() || null,
          logoUrl: 'https://via.placeholder.com/150',
          starRating: dto.starRating,
          timeZone: 'UTC',
          checkInTime: '14:00',
          checkOutTime: '12:00',
          status: HotelStatus.PENDING,
          createdBy: user.id,
          updatedBy: user.id,
        });
        await hotelRepository.save(newHotel);

        let updatedEmployee: Employee;

        if (existingEmployee) {
          // Attach the hotel to the existing Employee record
          existingEmployee.hotelId = newHotel.id;
          existingEmployee.updatedBy = user.id;
          await employeeRepository.save(existingEmployee);
          updatedEmployee = existingEmployee;
        } else {
          // Legacy fallback: no employee record existed
          const managerRole = await roleRepository.findOne({
            where: { name: 'Hotel Manager' },
          });
          if (!managerRole) {
            throw new BadRequestException(
              'Manager role not found. Please contact support.',
            );
          }

          const newEmployee = employeeRepository.create({
            userId: user.id,
            hotelId: newHotel.id,
            roleId: managerRole.id,
            createdBy: user.id,
            updatedBy: user.id,
          });
          await employeeRepository.save(newEmployee);
          updatedEmployee = newEmployee;
        }

        return { hotel: newHotel, employee: updatedEmployee };
      },
    );

    // Reload employee with relations for the response
    const fullEmployee = await this.employeeRepository.findOne({
      where: { id: employee.id },
      relations: { role: true, hotel: true },
    });

    const accessToken = await this.tokenService.generateAccessToken(user);
    const refreshToken =
      await this.refreshTokenService.createRefreshToken(user);
    const expiresIn = this.tokenService.getAccessTokenExpiresInSeconds();

    return AuthResponseDto.from(
      accessToken,
      refreshToken,
      expiresIn,
      user,
      fullEmployee,
    );
  }
}