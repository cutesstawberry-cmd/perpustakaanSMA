import React, { forwardRef } from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';

type CustomVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

interface ButtonProps extends Omit<AntButtonProps, 'variant'> {
  variant?: CustomVariant;
}

const variantMapping: Record<CustomVariant, Exclude<AntButtonProps['variant'], undefined>> = {
  default: 'solid',
  destructive: 'solid',
  outline: 'outlined',
  secondary: 'text',
  ghost: 'text',
  link: 'link',
};

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>((props, ref) => {
  const { variant = 'default', ...rest } = props;
  const antdVariant = variantMapping[variant];
  const isDestructive = variant === 'destructive';

  return (
    <AntButton
      {...rest}
      variant={antdVariant}
      danger={isDestructive}
      ref={ref}
    />
  );
});

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };