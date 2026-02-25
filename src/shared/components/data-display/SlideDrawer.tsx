import { Drawer } from 'antd';
import type { DrawerProps } from 'antd';
import { PageLoader } from '../feedback/PageLoader';

interface SlideDrawerProps extends Omit<DrawerProps, 'placement'> {
  isLoading?: boolean;
}

/**
 * Right-side slide drawer for record detail views.
 * Never changes the URL — receives selectedId as prop and fetches internally.
 */
export function SlideDrawer({ isLoading = false, children, ...props }: SlideDrawerProps) {
  return (
    <Drawer
      placement="right"
      width={640}
      destroyOnClose
      styles={{
        header: { borderBottom: '1px solid #f0f0f0' },
        body: { padding: 0 },
      }}
      {...props}
    >
      {isLoading ? <PageLoader tip="Loading details..." /> : children}
    </Drawer>
  );
}
