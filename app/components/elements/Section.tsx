import React from 'react';
import { Heading } from './Heading';

interface SectionProps {
    as?: keyof JSX.IntrinsicElements | React.ComponentType<any>;
    children: React.ReactNode;
    className?: string;
    divider?: 'none' | 'top' | 'bottom' | 'both';
    display?: 'flex' | 'grid';
    heading?: string;
    padding?: 'x' | 'y' | 'swimlane' | 'all';
}

export function Section({
    as: Component = 'section',
    children,
    className,
    divider = 'none',
    display = 'grid',
    heading,
    padding = 'all',
    ...props
}: SectionProps) {
    const paddings: Record<string, string> = {
        x: 'px-6 md:px-8 lg:px-12',
        y: 'py-6 md:py-8 lg:py-12',
        swimlane: 'pt-4 md:pt-8 lg:pt-12 md:pb-4 lg:pb-8',
        all: 'p-6 md:p-8 lg:p-12',
    };

    const dividers: Record<string, string> = {
        none: 'border-none',
        top: 'border-t border-primary/05',
        bottom: 'border-b border-primary/05',
        both: 'border-y border-primary/05',
    };

    const displays: Record<string, string> = {
        flex: 'flex',
        grid: 'grid',
    };


    return (
        <Component {...props}>
            {heading && (
                <Heading size="lead" className={padding === 'y' ? paddings['x'] : ''}>
                    {heading}
                </Heading>
            )}
            {children}
        </Component>
    );
}
