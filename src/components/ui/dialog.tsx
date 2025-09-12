import React, { createContext, useContext, useState } from 'react';
import { Modal, ModalProps } from 'antd';

interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProps {
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const DialogTrigger: React.FC<DialogTriggerProps> = ({ children, asChild }) => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('DialogTrigger must be used within Dialog');

  const handleClick = () => context.setOpen(true);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick });
  }

  return <div onClick={handleClick}>{children}</div>;
};

interface DialogContentProps extends Omit<ModalProps, 'open' | 'onCancel'> {
  children: React.ReactNode;
}

const DialogContent: React.FC<DialogContentProps> = ({ children, ...props }) => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('DialogContent must be used within Dialog');

  return (
    <Modal
      {...props}
      open={context.open}
      onCancel={() => context.setOpen(false)}
      footer={null}
      destroyOnClose
    >
      {children}
    </Modal>
  );
};

const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={`mb-4 ${className}`} {...props} />
);

const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2 className={`text-lg font-semibold ${className}`} {...props} />
);

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle };