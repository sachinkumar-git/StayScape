export function isFormValid(form) {
  if (form.checkValidity()) return true;
  form.querySelector(":invalid")?.focus();
  return false;
}
