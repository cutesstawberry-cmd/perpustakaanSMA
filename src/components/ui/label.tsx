import React, { forwardRef } from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = forwardRef<HTMLLabelElement, LabelProps>((props, ref) => {
  return <label {...props} ref={ref} />;
});

Label.displayName = 'Label';

export { Label };
export type { LabelProps };