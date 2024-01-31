import axios from "axios";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import {useContentModel} from "@/src/store.tsx";
import {LoadingScreen} from "@/src/components/actionComponents/LoadingScreen.tsx";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    Form,
    FormMessage
} from "@/src/components/layout/Form.tsx";
import {z} from "zod";
import {Input} from "@/src/components/layout/Input.tsx";
import {zodResolver} from "@hookform/resolvers/zod";
import {Button} from "@/src/components/actionComponents/Button.tsx";
import {OIDCLogin} from "@/src/components/navigation/OIDCButton.tsx";
import {useToast} from "@/src/hooks/useToast.ts";
import {SubmitHandler, useForm} from "react-hook-form";
import {Checkbox} from "@/src/components/actionComponents/CheckBox.tsx";
import {FC} from "react";

const formSchema = z.object({
    username: z.string().min(2, {
        message: "Username must be at least 2 characters.",
    }),
    password: z.string().min(2, {
        message: "Password must be at least 2 characters.",
    }),
    rememberMe: z.boolean()
})


type LoginComponentProps = {

}

export const LoginComponent:FC<LoginComponentProps> = () => {
    const {t} = useTranslation()
    const navigate = useNavigate()
    const configModel = useContentModel(state=>state.loginConfig)
    const {toast} = useToast()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: "",
            rememberMe: false
        },
    })

    const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = (data, p) => {
        p?.preventDefault()
        axios.post("/login", data)
            .then(() => {
                const basicAuthString = btoa(data.username + ":" + data.password)
                if (data.rememberMe){
                    localStorage.setItem("auth", basicAuthString)
                }
                else{
                    sessionStorage.setItem("auth", basicAuthString)
                }
                axios.defaults.headers.common['Authorization'] = 'Basic ' + basicAuthString;
                setTimeout(()=>navigate('/'), 1000)

            })
            .catch(() => {
                toast({
                    title: "Anmeldung fehlgeschlagen",
                    description: "Bitte überprüfe deine Anmeldedaten",
                })
            })
    }

    if (!configModel){
        console.log("loading login")
        return <LoadingScreen/>
    }

    if (!(configModel.oidcConfigured||configModel.basicAuth)){
         navigate("/")
    }

    return <section className="h-full">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
            <a href="https://github.com/SamTV12345/LIVISI-Unofficial-SmartHome-Frontend" target="_blank" className="flex items-center mb-6 text-2xl font-semibold text-white">
                <i className="fa-solid fa-music mr-5"></i>
                Unofficial LIVISI Gateway
            </a>
            <div
                className="w-full rounded-lg shadow border md:mt-0 sm:max-w-md xl:p-0 bg-gray-800 border-gray-700">
                <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                    <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white">
                        {t('sign-in')}
                    </h1>
                    {configModel?.basicAuth&& <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 text-white">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Benutzername</FormLabel>
                                        <FormControl>
                                            <Input placeholder="shadcn" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Anmelde-Name für das LIVISI Gateway
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>

                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Passwort</FormLabel>
                                        <FormControl>
                                            <Input placeholder="*****" type="password" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Passwort für das LIVISI Gateway
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>

                                )}
                            />
                            <FormField
                                control={form.control}
                                name="rememberMe"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="bg-white"
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>
                                                Remember me
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="">Absenden</Button>
                        </form>
                    </Form>}
                    {configModel.oidcConfigured&& configModel.oidcConfig&&
                        <OIDCLogin/>
                    }
                </div>
            </div>
        </div>
    </section>
}
