import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { placeFormData } from "@/data/place"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Plus } from "lucide-react"

export function CreateForm({ activeTab, isPublished, isDrafted, text }: { activeTab: string, isPublished: boolean, isDrafted: boolean, text: string }) {
    const [formTitle, setFormTitle] = useState("")
    const [formDescription, setFormDescription] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const onSubmit = (e: React.FormEvent) => {

        e.preventDefault();
        
        if (!formTitle.trim()) {
          toast.error("Please provide a form title", { position: "bottom-center" });
          return;
        }
    
        try {
          setLoading(true);
        //   const form = await createForm({
        //     name: formTitle.trim(),
        //     description: formDescription.trim() || null,
        //   });


          const formId = placeFormData.length + 1;
          toast.success("Form created successfully!", { position: "bottom-center" });
          navigate(`/edit-form/${formId}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to create form";
          toast.error(errorMessage, { position: "bottom-center" });
        } finally {
          setLoading(false);
        }
      };


  return (
    <Dialog>
    
      <DialogTrigger asChild>
      <Button variant="default" className={`cursor-pointer ${
                            activeTab === 'pub-forms' && isPublished ||
                            activeTab === 'drafts' && isDrafted ? 'hidden' : ''}`}>
                            <Plus className='w-6 h-6 text-white' />
                            {text}
                        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
      <form onSubmit={onSubmit}>
        <DialogHeader>
          <DialogTitle>Create a new form</DialogTitle>
          <DialogDescription className="pb-6">
            Name your form and click create to get started.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <Label htmlFor="Form-Title">Form Title *</Label>
            <Input id="Form-Title" name="Form-Title" value={formTitle} 
            onChange={(e) => setFormTitle(e.target.value)} required
            placeholder="Untitled"  disabled={loading}
            />
          </Field>
          <Field>
            <Label htmlFor="Form-Description">Form Description (optional)</Label>
            <Textarea className="mb-6" id="Form-Description" name="Form-Description" value={formDescription} 
            onChange={(e) => setFormDescription(e.target.value)} rows={4} 
            placeholder="No description provided."
            disabled={loading}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button" disabled={loading} onClick={() => {
              setFormTitle("");
              setFormDescription("");
            }}>Discard</Button>
          </DialogClose>
          <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Form"}</Button>
        </DialogFooter>
    </form>
      </DialogContent>
  </Dialog>
)
}