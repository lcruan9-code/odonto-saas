/** Link wa.me a partir de um telefone brasileiro em qualquer formato. */
export function whatsappLink(phone: string, text?: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length <= 11) digits = `55${digits}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
