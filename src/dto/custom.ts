import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsOnlyDate(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsOnlyDate',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: 'Please provide only date like 2020-12-08',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          const regex = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
          return typeof value === 'string' && regex.test(value);
        },
      },
    });
  };
}

export function IsFlowAddress(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsFlowAddress',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: 'Please provide only flow address like 0xabcdef0123456789',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          const regex = /0x[0-9a-f]{16}/;
          return typeof value === 'string' && regex.test(value);
        },
      },
    });
  };
}
