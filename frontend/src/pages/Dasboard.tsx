import { Moon, SlidersHorizontal, Search, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ButtonGroup } from "@/components/ui/button-group"
import { Field } from "@/components/ui/field"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { FormCard } from '@/components/FormCard';
import { useTheme } from "@/contexts/ThemeContext";
import { CreateForm } from '@/components/CreateForm';
import { fetchForms, deleteForm, ApiError, type Form as ApiForm } from "@/helpers/api";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type DashboardForm = {
    id: number;
    name: string;
    responses: number;
    fields: number;
    isPublished: boolean;
    published: string;
    status: string;
    created: string;
};

export function Dashboard() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tabFromUrl = searchParams.get("tab");
    const [activeTab, setActiveTab] = useState(() =>
        tabFromUrl === "drafts" ? "drafts" : "pub-forms"
    );
    const [placeFormData, setPlaceFormData] = useState<DashboardForm[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [formToDelete, setFormToDelete] = useState<DashboardForm | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const { toggleDarkMode } = useTheme();

    useEffect(() => {
        if (tabFromUrl === "drafts" || tabFromUrl === "pub-forms") {
            setActiveTab(tabFromUrl);
        }
    }, [tabFromUrl]);

    useEffect(() => {
        let cancelled = false;

        const loadForms = async () => {
            setLoading(true);
            setError(null);
            try {
                const forms = await fetchForms();
                if (cancelled) return;

                const mapped: DashboardForm[] = forms.map((form: ApiForm) => ({
                    id: form.form_id,
                    name: form.name,
                    responses: 0, // TODO: wire real response counts
                    fields: 0, // TODO: wire real field counts
                    isPublished: form.status.toLowerCase() !== "draft",
                    published: form.date_published ?? "on hold",
                    status: form.status,
                    created: form.date_created,
                }));

                setPlaceFormData(mapped);
            } catch (err) {
                if (cancelled) return;
                if (err instanceof ApiError) {
                    setError(err.message);
                } else {
                    setError("Failed to load forms");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadForms();

        return () => {
            cancelled = true;
        };
    }, []);

    const publishedForms = placeFormData.filter((form) => form.isPublished);
    const draftForms = placeFormData.filter((form) => !form.isPublished);

    const isNotPublished = !loading && publishedForms.length === 0;
    const isNotDrafted = !loading && draftForms.length === 0;

    const handleConfirmDelete = async () => {
        const form = formToDelete;
        setFormToDelete(null);
        if (!form) return;
        setDeleteLoading(true);
        try {
            await deleteForm(form.id);
            setPlaceFormData((prev) => prev.filter((f) => f.id !== form.id));
            toast.success("Form deleted.", { position: "bottom-center" });
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : "Failed to delete form.";
            toast.error(msg, { position: "bottom-center" });
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className={`min-h-screen bg-background`}>
            <header className="container mx-auto py-4 px-6 border-b h-16 border-border flex items-center justify-between">
                <h1 className="text-3xl font-black xl:ml-45 dark:text-white">FORMS</h1>
                <div className='flex items-center gap-6'>
                    <CreateForm activeTab={activeTab} isPublished={isNotPublished} isDrafted={isNotDrafted} text="New Form"  />
                    <Toggle aria-label="Toggle theme" size="default" variant="outline" className=' p-0 cursor-pointer xl:mr-45'
                        onClick={() => toggleDarkMode()}>
                        <Moon className=" dark:fill-foreground dark:text-white" />
                    </Toggle>
                </div>
            </header>
            <main className="container mx-auto px-6 py-8">
                <Tabs value={activeTab} onValueChange={(value) => {
                    setActiveTab(value);
                }}>

                    <TabsList className='mx-auto'>
                        <TabsTrigger value="pub-forms" className='cursor-pointer'>Published Forms</TabsTrigger>
                        <TabsTrigger value="drafts" className='px-3 cursor-pointer'>Drafts</TabsTrigger>
                        <Field className='pl-8'>
                            <InputGroup className='h-7.5'>
                                <ButtonGroup>
                                    <InputGroupInput type="text" placeholder="Search" />
                                    <Button variant="ghost" className='cursor-pointer hover:bg-transparent dark:hover:bg-transparent'>
                                        <SlidersHorizontal />
                                    </Button>
                                </ButtonGroup>
                                <InputGroupAddon>
                                    <Search className=" cursor-pointer" />
                                </InputGroupAddon>
                            </InputGroup>
                        </Field>
                    </TabsList>

                    <TabsContent value="pub-forms">
                        <div className="mt-10 px-10 grid grid-cols-1 gap-3 xl:mx-45 sm:grid-cols-2 md:px-8 md:grid-cols-3 lg:grid-cols-4">
                            {loading ? (
                                <div className="col-span-full text-center text-gray-500">
                                    Loading forms...
                                </div>
                            ) : error ? (
                                <div className="col-span-full text-center text-red-500">
                                    {error}
                                </div>
                            ) : isNotPublished ? (
                                <div className='flex flex-col gap-6 items-center justify-center col-span-full text-center'>
                                    <p className='text-gray-500'>Published forms will appear here</p>
                                    <CreateForm activeTab={activeTab} isPublished={false} isDrafted={isNotDrafted} text="Start a new form"  />
                                </div>
                            ) : (
                                publishedForms.map((place) => (
                                    <Link to={`/form-viewer/${place.id}`} className="block">
                                    <FormCard key={place.id}
                                        title={place.name}
                                        responses={place.responses}
                                        fields={place.fields}
                                        published={place.published}
                                        status={place.status}
                                        created={place.created} />
                                        </Link>
                                ))
                            )}

                        </div>

                    </TabsContent>

                    <TabsContent value="drafts">
                        <div className="mt-10 px-10 grid grid-cols-1 gap-3 xl:mx-45 sm:grid-cols-2 md:px-8 md:grid-cols-3 lg:grid-cols-4">
                        {loading ? (
                                <div className="col-span-full text-center text-gray-500">
                                    Loading forms...
                                </div>
                            ) : error ? (
                                <div className="col-span-full text-center text-red-500">
                                    {error}
                                </div>
                            ) : isNotDrafted ? (
                                <div className='flex flex-col gap-6 items-center justify-center col-span-full text-center'>
                                    <p className='text-gray-500'>Drafted forms will appear here</p>
                                    <CreateForm activeTab={activeTab} isPublished={isNotPublished} isDrafted={false} text="Start a new form"  />
                                </div>
                            ) : (
                                draftForms.map((place) => (
                                    <div key={place.id} className="relative">
                                        <Link to={`/edit-form/${place.id}`} className="block">
                                            <FormCard
                                                title={place.name}
                                                responses={place.responses}
                                                fields={place.fields}
                                                published={place.published}
                                                status={place.status}
                                                created={place.created}
                                            />
                                        </Link>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 right-2 z-10 h-8 w-8 cursor-pointer"
                                                    aria-label="Open menu"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                    }}
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onSelect={() => navigate(`/edit-form/${place.id}`)}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    className="cursor-pointer"
                                                    onSelect={() => setFormToDelete(place)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            <AlertDialog open={formToDelete !== null} onOpenChange={(open) => !open && setFormToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete form?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete &quot;{formToDelete?.name}&quot; and all its questions. You cannot undo this action.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={deleteLoading}
                            onClick={(e) => {
                                e.preventDefault();
                                handleConfirmDelete();
                            }}
                        >
                            {deleteLoading ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>

    );
}

export default Dashboard;