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
import {FC, useEffect} from "react";
import {postJson} from "@/src/api/httpClient.ts";
import {setAuthorizationHeader} from "@/src/api/authHeaderStore.ts";

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
        postJson("/login", data)
            .then(() => {
                const basicAuthString = btoa(data.username + ":" + data.password)
                if (data.rememberMe){
                    localStorage.setItem("auth", basicAuthString)
                }
                else{
                    sessionStorage.setItem("auth", basicAuthString)
                }
                setAuthorizationHeader('Basic ' + basicAuthString);
                setTimeout(()=>navigate('/'), 1000)

            })
            .catch(() => {
                toast({
                    title: t("ui_new.login.toast_failed_title"),
                    description: t("ui_new.login.toast_failed_description"),
                })
            })
    }

    useEffect(() => {
        if (configModel?.authMode === "none") {
            navigate("/")
        }
    }, [configModel?.authMode, navigate])

    if (!configModel){
        return <LoadingScreen/>
    }

    return <section className="min-h-full">
        <div className="login-screen-shell mx-auto flex flex-col items-center justify-center px-6 py-8 lg:py-0">
            <a href="https://github.com/SamTV12345/LIVISI-Unofficial-SmartHome-Frontend" target="_blank" className="mb-6 flex items-center text-2xl font-semibold text-slate-900 dark:text-slate-100">
                <i className="fa-solid fa-music mr-5"></i>
                Unofficial LIVISI Gateway
            </a>
            <div
                className="w-full rounded-xl border border-slate-300/90 bg-white/95 shadow-xl backdrop-blur-sm md:mt-0 sm:max-w-md xl:p-0 dark:border-slate-500/70 dark:bg-slate-900/90 dark:shadow-black/40">
                <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                    <h1 className="text-xl font-bold leading-tight tracking-tight text-slate-900 md:text-2xl dark:text-slate-100">
                        {t('sign-in')}
                    </h1>
                    {configModel.authMode === "basic" && <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-slate-900 dark:text-slate-100">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem className="rounded-lg border border-slate-300/80 bg-white/70 p-3 dark:border-slate-500/70 dark:bg-slate-950/45">
                                        <FormLabel>{t("ui_new.login.username_label")}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t("ui_new.login.username_placeholder")} className="border-slate-300 bg-white dark:border-slate-500 dark:bg-slate-950/70" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            {t("ui_new.login.username_description")}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>

                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="rounded-lg border border-slate-300/80 bg-white/70 p-3 dark:border-slate-500/70 dark:bg-slate-950/45">
                                        <FormLabel>{t("ui_new.login.password_label")}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t("ui_new.login.password_placeholder")} type="password" className="border-slate-300 bg-white dark:border-slate-500 dark:bg-slate-950/70" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            {t("ui_new.login.password_description")}
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
                                                {t("ui_new.login.remember_me")}
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full">{t("ui_new.login.submit")}</Button>
                        </form>
                    </Form>}
                    {configModel.authMode === "oidc" && configModel.oidcConfig &&
                        <OIDCLogin/>
                    }
                </div>
            </div>
        </div>
    </section>
}
