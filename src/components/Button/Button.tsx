'use client';

import { Button as MantineButton, ButtonProps } from '@mantine/core';
import { ComponentPropsWithoutRef } from 'react';
import classes from './Button.module.css';

interface CustomButtonProps extends ButtonProps {
  variant?: 'gradient' | 'subtle';
  onClick?: ComponentPropsWithoutRef<'button'>['onClick'];
}

export function Button({ variant = 'gradient', className, ...props }: CustomButtonProps) {
  return (
    <MantineButton
      {...props}
      variant={variant}
      classNames={{
        root: classes.root,
        inner: classes.inner,
      }}
    />
  );
}
