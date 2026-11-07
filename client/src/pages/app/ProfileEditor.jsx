import { ArrowUpRight, Check, CircleDashed, ImagePlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Page, PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Field, TextareaField } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useArtistPage, useProfileImage, useUpdateProfile } from '@/hooks/useArtists';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const SOCIALS = [
  ['instagram', 'Instagram', 'https://instagram.com/yourname'],
  ['tiktok', 'TikTok', 'https://tiktok.com/@yourname'],
  ['x', 'X (Twitter)', 'https://x.com/yourname'],
  ['youtube', 'YouTube', 'https://youtube.com/@yourname'],
  ['facebook', 'Facebook', 'https://facebook.com/yourname'],
  ['website', 'Website', 'https://yourname.com'],
];

/** Set up or edit an artist's public page and fan base. Owners edit their own; admins can edit any. */
export default function ProfileEditor() {
  const { slug } = useParams();
  const { data: artist, isPending, isError } = useArtistPage(slug);
  if (isPending) return <Page><Skeleton className="h-96" /></Page>;
  if (isError || !artist?.canEdit) {
    return <Page><p className="py-20 text-center text-muted">You can only edit your own artist page.</p></Page>;
  }
  return <Editor artist={artist} />;
}

function Editor({ artist }) {
  const save = useUpdateProfile();
  const [form, setForm] = useState(() => ({
    name: artist.name,
    genre: artist.genre,
    location: artist.location,
    bio: artist.bio,
    fanBaseName: artist.onboarded || artist.fanBase.name !== `${artist.name} fans` ? artist.fanBase.name : '',
    fanBaseMember: artist.onboarded || artist.fanBase.member !== `${artist.name} fan` ? artist.fanBase.member : '',
    welcome: artist.onboarded ? artist.welcome : '',
    socials: { ...Object.fromEntries(SOCIALS.map(([k]) => [k, artist.socials?.[k] ?? ''])) },
  }));
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setSocial = (k) => (e) => setForm((f) => ({ ...f, socials: { ...f.socials, [k]: e.target.value } }));

  const member = form.fanBaseMember.trim() || 'fan';
  const welcomePreview = form.welcome.trim() || `You’re an official ${member}`;
  const steps = [
    ['A short bio', form.bio.trim().length >= 20],
    ['Your fan base name', Boolean(form.fanBaseName.trim() && form.fanBaseMember.trim())],
    ['Profile photo and banner', Boolean(artist.avatar && artist.banner)],
  ];

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'At least 2 characters';
    if (form.fanBaseName.trim() && !form.fanBaseMember.trim()) errs.fanBaseMember = 'What’s one fan called?';
    if (form.fanBaseMember.trim() && !form.fanBaseName.trim()) errs.fanBaseName = 'What are your fans called together?';
    for (const [k] of SOCIALS) if (form.socials[k] && !/^https:\/\/\S+\.\S+/.test(form.socials[k].trim())) errs[k] = 'Use a full link starting with https://';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    save.mutate({
      id: artist._id,
      input: {
        name: form.name.trim(),
        genre: form.genre.trim(),
        location: form.location.trim(),
        bio: form.bio.trim(),
        fanBaseName: form.fanBaseName.trim(),
        fanBaseMember: form.fanBaseMember.trim(),
        welcome: form.welcome.trim(),
        socials: Object.fromEntries(Object.entries(form.socials).map(([k, v]) => [k, v.trim()])),
      },
    }, {
      onSuccess: (a) => toast.success(a.onboarded ? 'Your artist page is saved' : 'Saved', {
        description: a.onboarded ? `Fans see it at /a/${a.slug}` : 'Add a bio and your fan base name to finish setting up.',
      }),
      onError: (err) => setErrors({ [err.field ?? 'form']: err.message }),
    });
  };

  return (
    <Page>
      <PageHeader
        eyebrow={artist.onboarded ? 'Your artist page' : 'Set up your artist page'}
        title={artist.name}
        subtitle={artist.onboarded ? 'This is what fans see on your page.' : 'A few details and your fan base is ready for its first fans.'}
      >
        <Button asChild variant="secondary"><Link to={`/a/${artist.slug}`} target="_blank"><ArrowUpRight className="size-4" /> View page</Link></Button>
      </PageHeader>

      {!artist.onboarded && (
        <ol className="mb-8 grid gap-2 rounded-3xl border border-brand/30 bg-brand/5 p-5 sm:grid-cols-3">
          {steps.map(([label, done]) => (
            <li key={label} className="flex items-center gap-2 font-medium">
              {done ? <Check className="size-5 text-emerald-500" /> : <CircleDashed className="size-5 text-muted" />} {label}
            </li>
          ))}
        </ol>
      )}

      <Images artist={artist} />

      <form onSubmit={submit} noValidate className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="space-y-4 rounded-3xl border border-border bg-elevated/60 p-5 sm:p-7">
          <h2 className="text-xl font-bold">About you</h2>
          <Field label="Artist name" value={form.name} onChange={set('name')} error={errors.name} maxLength={60} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Genre" value={form.genre} onChange={set('genre')} placeholder="e.g. Afrobeats" maxLength={60} />
            <Field label="Based in" value={form.location} onChange={set('location')} placeholder="e.g. Lagos, Nigeria" maxLength={80} />
          </div>
          <TextareaField label="Biography" value={form.bio} onChange={set('bio')} maxLength={3000} rows={9} hint="Your story, your sound, your wins. Leave an empty line between paragraphs." />
        </section>

        <div className="space-y-8">
          <section className="space-y-4 rounded-3xl border border-border bg-elevated/60 p-5 sm:p-7">
            <h2 className="text-xl font-bold">Your fan base</h2>
            <p className="text-sm text-muted">What your fans call themselves. DAMODOT’s fans are the <b>Disturbers</b>, and one fan is a <b>Disturber</b>.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fans together" value={form.fanBaseName} onChange={set('fanBaseName')} error={errors.fanBaseName} placeholder="e.g. Disturbers" maxLength={40} />
              <Field label="One fan" value={form.fanBaseMember} onChange={set('fanBaseMember')} error={errors.fanBaseMember} placeholder="e.g. Disturber" maxLength={40} />
            </div>
            <Field label="Welcome message" value={form.welcome} onChange={set('welcome')} placeholder={`You’re an official ${member}`} maxLength={140} />
            <div className="rounded-2xl bg-[#0a0a0b] p-5 text-white">
              <p className="text-xs tracking-[0.25em] text-white/50 uppercase">What fans see</p>
              <p className="mt-2 font-display text-2xl tracking-wide text-[#b06bff]">WELCOME BACK, {member.toUpperCase()}</p>
              <p className="font-display text-lg tracking-wide text-white/75">{welcomePreview.toUpperCase()}</p>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-border bg-elevated/60 p-5 sm:p-7">
            <h2 className="text-xl font-bold">Socials</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {SOCIALS.map(([k, label, ph]) => (
                <Field key={k} label={label} type="url" value={form.socials[k]} onChange={setSocial(k)} error={errors[k]} placeholder={ph} maxLength={300} />
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-2">
          {errors.form && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{errors.form}</p>}
          <Button type="submit" size="lg" loading={save.isPending} className="w-full sm:w-auto"><Check className="size-5" /> Save artist page</Button>
        </div>
      </form>
    </Page>
  );
}

/** Banner and profile photo, uploaded straight away (resized on the server). */
function Images({ artist }) {
  const image = useProfileImage();
  const [busy, setBusy] = useState(null);
  const pick = (kind) => (file) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return toast.error('Use a JPG, PNG or WebP image');
    if (file.size > 15 * 1024 * 1024) return toast.error('Images must be under 15 MB');
    setBusy(kind);
    image.mutate({ id: artist._id, kind, file }, {
      onSuccess: () => toast.success(kind === 'avatar' ? 'Profile photo updated' : 'Banner updated'),
      onSettled: () => setBusy(null),
    });
  };
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border">
      <ImageSlot className="h-40 w-full sm:h-56" src={artist.banner} label="Banner (wide, 1920×640)" busy={busy === 'banner'} onPick={pick('banner')} />
      <div className="absolute bottom-4 left-4 sm:left-6">
        <ImageSlot className="size-24 rounded-full border-4 border-bg sm:size-32" src={artist.avatar} label="Photo" busy={busy === 'avatar'} onPick={pick('avatar')} round />
      </div>
    </section>
  );
}

function ImageSlot({ src, label, busy, onPick, className, round }) {
  const input = useRef(null);
  const [preview, setPreview] = useState(null);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      disabled={busy}
      className={cn('group relative block cursor-pointer overflow-hidden bg-gradient-to-br from-brand-strong/60 to-subtle', className)}
      aria-label={`Change ${label.toLowerCase()}`}
    >
      {(preview || src) && <img src={preview || src} alt="" className="absolute inset-0 size-full object-cover" />}
      <span className={cn('absolute inset-0 grid place-items-center bg-black/45 text-sm font-semibold text-white transition', busy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100', !(preview || src) && 'opacity-100')}>
        <span className="flex flex-col items-center gap-1 px-2 text-center">
          <ImagePlus className={cn('size-6', busy && 'animate-pulse')} />
          {busy ? 'Uploading…' : round ? 'Photo' : label}
        </span>
      </span>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setPreview(URL.createObjectURL(file));
          onPick(file);
          e.target.value = '';
        }}
      />
    </button>
  );
}
