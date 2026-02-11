import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SavedProgramsList } from "@/components/dashboard/saved-programs-list";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/search");
  }

  // Get family
  const { data: family } = await supabase
    .from("families")
    .select("id")
    .eq("user_id", user.id)
    .single();

  // Get saved programs
  let savedPrograms: Array<{
    id: string;
    programId: string;
    status: string;
    notes: string | null;
    createdAt: string;
    program: {
      id: string;
      name: string;
      slug: string;
      address: string | null;
      primaryType: string;
    } | null;
  }> = [];

  if (family) {
    const { data } = await supabase
      .from("saved_programs")
      .select(`
        id,
        program_id,
        status,
        notes,
        created_at,
        programs:program_id(
          id,
          name,
          slug,
          address,
          primary_type
        )
      `)
      .eq("family_id", family.id)
      .order("created_at", { ascending: false });

    savedPrograms = (data ?? []).map((row) => {
      const program = row.programs as unknown as Record<string, unknown> | null;
      return {
        id: row.id as string,
        programId: row.program_id as string,
        status: row.status as string,
        notes: (row.notes as string) ?? null,
        createdAt: row.created_at as string,
        program: program
          ? {
              id: program.id as string,
              name: program.name as string,
              slug: program.slug as string,
              address: (program.address as string) ?? null,
              primaryType: program.primary_type as string,
            }
          : null,
      };
    });
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900">Saved Programs</h2>
        <div className="mt-4">
          <SavedProgramsList initialPrograms={savedPrograms} />
        </div>
      </div>
    </div>
  );
}
