import { Moon, SlidersHorizontal, Search } from 'lucide-react';
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
import { useState } from "react";
import { placeFormData } from '@/data/place';
import { FormCard } from '@/components/FormCard';
import { useTheme } from "@/contexts/ThemeContext";
import { CreateForm } from '@/components/CreateForm';

export function Dashboard() {

    const [activeTab, setActiveTab] = useState("pub-forms");
    const { toggleDarkMode } = useTheme();
 
    const isNotPublished = placeFormData.filter((form) => form.isPublished).length === 0;
    const isNotDrafted = placeFormData.filter((form) => !form.isPublished).length === 0;

    

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
                        <TabsTrigger value="pub-forms">Published Forms</TabsTrigger>
                        <TabsTrigger value="drafts" className='px-3'>Drafts</TabsTrigger>
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
                            {isNotPublished ? (
                                <div className='flex flex-col gap-6 items-center justify-center col-span-full text-center'>
                                    <p className='text-gray-500'>Published forms will appear here</p>
                                    <CreateForm activeTab={activeTab} isPublished={false} isDrafted={isNotDrafted} text="Start a new form"  />
                                </div>
                            ) : (
                                placeFormData.filter((form) => form.isPublished).map((place) => (
                                    <FormCard key={place.id}
                                        title={place.name}
                                        responses={place.responses}
                                        fields={place.fields}
                                        published={place.published}
                                        status={place.status}
                                        created={place.created} />
                                ))
                            )}

                        </div>

                    </TabsContent>

                    <TabsContent value="drafts">
                        <div className="mt-10 px-10 grid grid-cols-1 gap-3 xl:mx-45 sm:grid-cols-2 md:px-8 md:grid-cols-3 lg:grid-cols-4">
                        {isNotDrafted ? (
                                <div className='flex flex-col gap-6 items-center justify-center col-span-full text-center'>
                                    <p className='text-gray-500'>Drafted forms will appear here</p>
                                    <CreateForm activeTab={activeTab} isPublished={isNotPublished} isDrafted={false} text="Start a new form"  />
                                </div>
                            ) : (
                                placeFormData.filter((form) => !form.isPublished).map((place) => (
                                    <FormCard key={place.id}
                                        title={place.name}
                                        responses={place.responses}
                                        fields={place.fields}
                                        published={place.published}
                                        status={place.status}
                                        created={place.created} />
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

        </div>

    );
}

export default Dashboard;