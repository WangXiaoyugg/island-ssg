import { usePageData } from '@runtime';
import '../styles/base.css';
import '../styles/vars.css';
import { Nav } from '../components/Nav';
import { HomeLayout } from './HomeLayout';

export function Layout() {
  const pageData = usePageData();
  const { pageType } = pageData;

  const getContent = () => {
    if (pageType === 'home') {
      return <HomeLayout />;
    } else if (pageType === 'doc') {
      return <div>正文页面</div>;
    } else {
      return <div>404 页面</div>;
    }
  };

  return (
    <div>
      <Nav />
      {getContent()}
    </div>
  );
}
