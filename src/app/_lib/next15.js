// Centralized helpers for Next.js 15 App Router params handling
// Server pages should await once at the top; client pages read directly.

export async function serverParams(props) {
  return {
    params: await props.params,
    searchParams: props.searchParams ? await props.searchParams : undefined,
  };
}

export function clientParams(props) {
  return {
    params: props.params ?? {},
    searchParams: props.searchParams ?? {},
  };
}

