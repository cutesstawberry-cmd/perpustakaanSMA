import React, { forwardRef } from 'react';
import { Input as AntInput } from 'antd';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => {
  return <textarea {...props} ref={ref} />;
});

Textarea.displayName = 'Textarea';

export { Textarea };
export type { TextareaProps };