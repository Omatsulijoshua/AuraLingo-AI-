import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createTicket(userId: string, subject: string, message: string) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject,
        message,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });
  }

  async getUserTickets(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllTickets() {
    return this.prisma.supportTicket.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async replyToTicket(ticketId: string, reply: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        reply,
        status: 'RESOLVED',
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });
  }

  async updateTicketStatus(ticketId: string, status: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });
  }
}
