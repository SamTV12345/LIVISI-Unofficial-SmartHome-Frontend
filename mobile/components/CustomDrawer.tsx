import { createDrawerNavigator } from '@react-navigation/drawer';
import { RouteNode, useContextKey, useRouteNode } from 'expo-router/build/Route';
import { useFilterScreenChildren } from 'expo-router/build/layouts/withLayoutContext';
import { Screen } from 'expo-router/build/primitives';
import { ScreenProps, createGetIdForRoute, getQualifiedRouteComponent } from 'expo-router/build/useScreens';
import * as React from 'react';

const { Navigator } = createDrawerNavigator();

export function Drawer({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    const contextKey = useContextKey();
    const { screens } = useFilterScreenChildren(children, { contextKey });

    return <Navigator>{useSortedScreens(screens!)}</Navigator>;
}

function useSortedScreens(order: ScreenProps[]): React.ReactNode[] {
    const node = useRouteNode();

    const sorted = node?.children?.length ? getSortedChildren(node.children, order, node.initialRouteName) : [];
    return React.useMemo(() => sorted.map((value) => routeToScreen(value.route, value.props)), [sorted]);
}

function getSortedChildren(
    children: RouteNode[],
    order?: ScreenProps[],
    initialRouteName?: string,
): { route: RouteNode; props: Partial<ScreenProps> }[] {
    const entries = [...children];

    return order!
        .map(({ name, redirect, initialParams, listeners, options, getId }) => {
            if (!entries.length) {
                console.warn(`[Layout children]: Too many screens defined. Route "${name}" is extraneous.`);
                return null;
            }
            const matchIndex = entries.findIndex((child) => child.route === name);
            if (matchIndex === -1) {
                console.warn(
                    `[Layout children]: No route named "${name}" exists in nested children:`,
                    children.map(({ route }) => route),
                );
                return null;
            } else {
                // Get match and remove from entries
                const match = entries[matchIndex];
                entries.splice(matchIndex, 1);

                // Ensure to return null after removing from entries.
                if (redirect) {
                    if (typeof redirect === 'string') {
                        throw new Error(`Redirecting to a specific route is not supported yet.`);
                    }
                    return null;
                }

                return {
                    route: match,
                    props: { initialParams, listeners, options, getId },
                };
            }
        })
        .filter(Boolean) as {
        route: RouteNode;
        props: Partial<ScreenProps>;
    }[];
}

function routeToScreen(route: RouteNode, { options, ...props }: Partial<ScreenProps> = {}) {
    return (
        <Screen
            // Users can override the screen getId function.
            getId={createGetIdForRoute(route)}
            {...props}
            name={route.route}
            key={route.route}
            options={(args) => {
                // Only eager load generated components
                const staticOptions = route.generated ? route.loadRoute()?.getNavOptions : null;
                const staticResult = typeof staticOptions === 'function' ? staticOptions(args) : staticOptions;
                const dynamicResult = typeof options === 'function' ? options?.(args) : options;
                const output = {
                    ...staticResult,
                    ...dynamicResult,
                };

                // Prevent generated screens from showing up in the tab bar.
                if (route.generated) {
                    output.tabBarButton = () => null;
                    // TODO: React Navigation doesn't provide a way to prevent rendering the drawer item.
                    output.drawerItemStyle = { height: 0, display: 'none' };
                }

                return output;
            }}
            getComponent={() => getQualifiedRouteComponent(route)}
        />
    );
}