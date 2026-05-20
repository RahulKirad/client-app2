import { Link } from 'react-router-dom';
import { isInternalAppHref } from '../lib/seo';

type InternalAppLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

/** Renders React Router Link for same-site paths; keeps external/mailto as <a>. */
export default function InternalAppLink({
  href,
  children,
  className,
  ...rest
}: InternalAppLinkProps) {
  if (!isInternalAppHref(href)) {
    return (
      <a href={href} className={className} {...rest}>
        {children}
      </a>
    );
  }

  const trimmed = href.trim();
  if (trimmed.startsWith('#')) {
    return (
      <Link to={{ pathname: '/', hash: trimmed.slice(1) }} className={className} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <Link to={trimmed} className={className} {...rest}>
      {children}
    </Link>
  );
}
