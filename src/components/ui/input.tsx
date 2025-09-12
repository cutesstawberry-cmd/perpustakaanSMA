import React, { forwardRef } from 'react';
import { Input as AntInput, InputProps as AntInputProps, InputRef } from 'antd';

interface InputProps extends AntInputProps {}

const Input = forwardRef<InputRef, InputProps>((props, ref) => {
  return <AntInput {...props} ref={ref} />;
});

Input.displayName = 'Input';

export { Input };
export type { InputProps };