-- Allows authenticated users to permanently delete their own account
create or replace function public.delete_account()
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_account() from public;
grant execute on function public.delete_account() to authenticated;
