import { Controller, Get, Post, Body, Param, Put, Req, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // Student: Create Ticket
  @Post('tickets')
  async createTicket(
    @Req() req: any,
    @Body('subject') subject: string,
    @Body('message') message: string,
  ) {
    return this.supportService.createTicket(req.user.sub, subject, message);
  }

  // Student: View Own Tickets
  @Get('tickets')
  async getMyTickets(@Req() req: any) {
    return this.supportService.getUserTickets(req.user.sub);
  }

  // Admin/Tutor: View All Tickets
  @Get('admin/tickets')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TUTOR)
  async getAllTickets() {
    return this.supportService.getAllTickets();
  }

  // Admin/Tutor: Reply to Ticket
  @Post('admin/tickets/:id/reply')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TUTOR)
  async replyTicket(@Param('id') id: string, @Body('reply') reply: string) {
    return this.supportService.replyToTicket(id, reply);
  }

  // Admin/Tutor: Update Ticket Status
  @Put('admin/tickets/:id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TUTOR)
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.supportService.updateTicketStatus(id, status);
  }
}
