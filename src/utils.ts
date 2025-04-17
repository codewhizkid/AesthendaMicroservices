export const toPlainObject = (obj: any) => {
  return obj && typeof obj.toObject === 'function' 
    ? obj.toObject() 
    : obj;
}; 