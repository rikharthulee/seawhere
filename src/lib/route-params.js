// Works whether Next gives plain objects (14) or Promises (15)
export async function getRouteParams(props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  return { params, searchParams };
}
