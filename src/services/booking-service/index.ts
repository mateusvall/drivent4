import { notFoundError, unauthorizedError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";

async function getBookingByUserId(userId: number) {
  const booking = await bookingRepository.findBookingByUserId(userId);

  if(!booking) throw notFoundError();

  return {
    id: booking.id,
    Room: booking.Room
  };
}

async function postBooking(userId: number, roomId: number) {
  await checkTicket(userId);
  await checkRoomAvailability(roomId);

  const booking = await bookingRepository.insertBooking(userId, roomId);

  return {
    bookingId: booking.id
  };
}

async function changeBooking(userId: number, roomId: number, bookingId: number) {
  await checkTicket(userId);
  await checkRoomAvailability(roomId);

  const booking = await bookingRepository.updateBooking(bookingId, roomId);

  return {
    bookingId: booking.id
  };
}

async function checkTicket(userId: number) {
  //Tem enrollment?
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    throw unauthorizedError();
  }
  //Tem ticket pago isOnline false e includesHotel true
  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);

  if (!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw unauthorizedError();
  }
}

async function checkRoomAvailability(roomId: number) {
  const room = await bookingRepository.findRoomById(roomId);

  if(!room) throw notFoundError();

  const bookings = await bookingRepository.findBookingsByRoomId(roomId);

  if(bookings.length >= room.capacity) {
    throw unauthorizedError();
  }
}

const bookingService = {
  getBookingByUserId,
  postBooking,
  changeBooking
};

export default bookingService;
