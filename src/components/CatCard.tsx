import { CSSProperties, ReactNode } from 'react';
import { CatSilhouette, MapPinIcon } from './Icons';

type CatCardContent = {
  name: string;
  age: string;
  breed: string;
  distance: string;
  vibe: string;
  bio: string;
  traits: string[];
  image: string;
};

type CatCardProps = {
  profile: CatCardContent;
  badge?: string;
  className?: string;
  style?: CSSProperties;
  overlay?: ReactNode;
};

export function CatCard({ profile, badge, className = '', style, overlay }: CatCardProps) {
  return (
    <article className={`cat-card ${className}`} style={style}>
      <div className="cat-card-portrait" style={{ background: profile.image }}>
        <CatSilhouette className="cat-card-silhouette" />
        <div className="cat-card-sheen" aria-hidden="true" />
      </div>

      {badge ? <div className="cat-card-badge">{badge}</div> : null}
      {overlay}

      <div className="cat-card-info">
        <div className="cat-card-title">
          <h3>
            {profile.name || 'Unnamed cat'}
            <span>{profile.age}</span>
          </h3>
          <p className="cat-card-meta">
            {profile.breed}
            <span className="dot" aria-hidden="true" />
            <MapPinIcon className="meta-icon" />
            {profile.distance}
          </p>
        </div>

        <p className="cat-card-vibe">{profile.vibe}</p>
        <p className="cat-card-bio">{profile.bio}</p>

        {profile.traits.length > 0 ? (
          <ul className="trait-list" aria-label="Traits">
            {profile.traits.map((trait) => (
              <li key={trait}>{trait}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
