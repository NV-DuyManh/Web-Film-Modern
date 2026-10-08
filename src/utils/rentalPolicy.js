export const RENTAL_DAYS = 30;
export const RENTAL_DURATION_MS = RENTAL_DAYS * 24 * 60 * 60 * 1000;
export const RENTAL_NOTICE = 'Thời hạn thuê là 30 ngày kể từ khi thanh toán thành công. Thuê lại khi còn hạn sẽ cộng thêm 30 ngày vào thời hạn hiện tại.';

export function rentalExpiry(previousExpiry, now = Date.now()) {
    const previous = new Date(previousExpiry).getTime();
    return new Date(Math.max(now, Number.isFinite(previous) ? previous : now) + RENTAL_DURATION_MS).toISOString();
}

export function validRentalPrice(value) {
    const price = Number(value);
    return Number.isFinite(price) && price > 0 && price / 26000 >= 0.01;
}
