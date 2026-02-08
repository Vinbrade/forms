import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Form, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function FormCard({ title, responses, fields, published, status, created }: { title: string, responses: number, fields: number, published: string, status: string, created: string }) {
    return (
        <Card className='pt-0 h-60 relative cursor-pointer  border-2 hover:border-2 hover:border-primary'>
            <Badge variant="default" className={`absolute top-2 right-2 ${
                    status === 'active' ? 'bg-green-600' :
                    status === 'draft' ? 'bg-yellow-600' :
                        'bg-primary'}`}>{status}</Badge>
            <CardHeader className={`flex h-30 border-b border-border ${
                status === 'active' ? 'bg-green-100 dark:bg-green-950' : 
                status === 'draft' ? 'bg-yellow-100 dark:bg-yellow-950' : 
                'bg-primary-foreground dark:bg-gray-800'}  items-end`}>
                <CardTitle className='text-wrap font-bold'>{title}</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-2'>
                <CardDescription className={`flex items-center gap-2 ${
                    status === 'draft' ? 'hidden' :
                        ''}`}>
                    <Users className='w-4 h-4' />
                    {responses} responses
                </CardDescription>
                <CardDescription className='flex items-center gap-2'>
                    <Form className='w-4 h-4' />{fields} fields</CardDescription>
                <CardDescription className='flex items-center gap-2'>
                    <Calendar className='w-4 h-4 text-wrap' />{ status === 'draft' ? `created on ${created}` : `published on ${published}`}</CardDescription>
            </CardContent>
        </Card>);
}

export default FormCard;