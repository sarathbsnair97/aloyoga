
interface HeadingProps {
    as?: keyof JSX.IntrinsicElements | React.ComponentType<any>;
    children: React.ReactNode;
    className?: string;
    format?: boolean;
    size?: 'display' | 'heading' | 'lead' | 'copy';
    width?: 'default' | 'narrow' | 'wide';
}

export function Heading({
    as: Component = 'h2',
    children,
    className = '',
    format,
    size = 'heading',
    width = 'default',
    ...props
}: HeadingProps) {
    const sizes: Record<string, string> = {
        display: 'font-bold text-display',
        heading: 'font-bold text-heading',
        lead: 'font-bold text-lead',
        copy: 'font-medium text-copy',
    };

    const widths: Record<string, string> = {
        default: 'max-w-prose',
        narrow: 'max-w-prose-narrow',
        wide: 'max-w-prose-wide',
    };

    return (
        <Component {...props}>
            {children}
        </Component>
    );
}
